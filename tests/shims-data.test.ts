import { describe, it, expect } from 'vitest'
import { run } from './pyodide-node'

describe('mlflow shim', () => {
  it('tracks runs, searches, registers', async () => {
    const r = await run(`
import mlflow
mlflow.set_experiment("demo")
for lr in [0.1, 0.01]:
    with mlflow.start_run(run_name=f"lr-{lr}"):
        mlflow.log_param("lr", lr)
        mlflow.log_metric("acc", 0.9 if lr == 0.1 else 0.8)
df = mlflow.search_runs(order_by=["metrics.acc DESC"])
print(df[["tags.mlflow.runName", "params.lr", "metrics.acc"]])
print(len(mlflow.search_runs(filter_string="metrics.acc > 0.85")))
class M(mlflow.pyfunc.PythonModel):
    def predict(self, context, model_input, params=None):
        return [x * 2 for x in model_input]
with mlflow.start_run() as run:
    info = mlflow.pyfunc.log_model(name="model", python_model=M())
mv = mlflow.register_model(info.model_uri, "doubler")
mlflow.MlflowClient().set_registered_model_alias("doubler", "champion", mv.version)
print(mv.version, mlflow.pyfunc.load_model("models:/doubler@champion").predict([1,2]))
`)
    expect(r.error).toBeNull()
    expect(r.stdout).toContain('lr-0.1')
    expect(r.stdout).toContain('1\n1 [2, 4]')
    expect(r.emits.some((e) => e.kind === 'mlflow_runs')).toBe(true)
  })
})

describe('pyspark shim', () => {
  it('dataframe ops, sql, delta', async () => {
    const r = await run(`
from pyspark.sql import SparkSession
import pyspark.sql.functions as F
from delta.tables import DeltaTable
spark = SparkSession.builder.appName("t").getOrCreate()
df = spark.createDataFrame([("Ann","eng",100),("Bob","eng",80),("Cy","ops",70)], ["name","dept","salary"])
df.printSchema()
out = df.groupBy("dept").agg(F.sum("salary").alias("total"), F.avg("salary")).orderBy(F.desc("total"))
out.show()
df.filter(F.col("salary") > 75).withColumn("bonus", F.col("salary") * 0.1).show()
df.createOrReplaceTempView("emp")
spark.sql("SELECT dept, COUNT(*) AS n FROM emp GROUP BY dept ORDER BY dept").show()
df.write.format("delta").mode("overwrite").saveAsTable("main.hr.emp")
df.filter("dept = 'eng'").write.mode("append").saveAsTable("main.hr.emp")
DeltaTable.forName(spark, "main.hr.emp").delete("name = 'Cy'")
print(spark.table("main.hr.emp").count(), spark.read.option("versionAsOf", 0).table("main.hr.emp").count())
spark.sql("DESCRIBE HISTORY main.hr.emp").select("version","operation").show()
print(spark.sql("SELECT COUNT(*) AS c FROM main.hr.emp VERSION AS OF 1").collect())
df.select(F.when(F.col("salary") > 75, "high").otherwise("low").alias("band"), "name").show()
`)
    expect(r.error).toBeNull()
    expect(r.stdout).toContain('| eng|  180|')
  })
})

describe('spark null semantics', () => {
  it('NULL != x is NULL, filtered out', async () => {
    const r = await run(`
from pyspark.sql import SparkSession
import pyspark.sql.functions as F
spark = SparkSession.builder.getOrCreate()
df = spark.createDataFrame([(1, "a"), (2, None), (3, "c")], ["id", "tag"])
print(df.filter(F.col("tag") != "a").count())
print(df.filter((F.col("id") > 1) & (F.col("tag") != "a")).count())
`)
    expect(r.error).toBeNull()
    expect(r.stdout).toBe('1\n1\n')
  })
  it('AND/OR follow three-valued logic, isin keeps NULL, try_cast nulls bad text', async () => {
    const r = await run(`
from pyspark.sql import SparkSession
import pyspark.sql.functions as F
spark = SparkSession.builder.getOrCreate()
df = spark.createDataFrame([(1, None, "2.5"), (2, "b", "n/a"), (3, "c", None)], "id int, tag string, amount string")
print([r["v"] for r in df.select((F.col("tag").isNull() | (F.col("tag") == "x")).alias("v")).collect()])
print([r["v"] for r in df.select((F.col("tag").isNotNull() & (F.col("tag") == "x")).alias("v")).collect()])
print([r["v"] for r in df.select(F.col("tag").isin(["b"]).alias("v")).collect()])
print(df.filter(~F.col("tag").isin(["b"])).count())
print([r["v"] for r in df.select(F.col("amount").try_cast("double").alias("v")).collect()])
`)
    expect(r.error).toBeNull()
    expect(r.stdout).toBe('[True, False, False]\n[False, False, False]\n[None, True, False]\n1\n[2.5, None, None]\n')
  })
  it('spark.sql binds named parameters as values', async () => {
    const r = await run(`
from pyspark.sql import SparkSession
spark = SparkSession.builder.getOrCreate()
spark.createDataFrame([("St. John's", 3), ("Oslo", 5)], ["city", "n"]).createOrReplaceTempView("cities")
print(spark.sql("SELECT n FROM cities WHERE city = :city AND n >= :min", args={"city": "St. John's", "min": 1}).collect())
print(spark.sql("SELECT n FROM cities WHERE city = :city", args={"city": "x' OR '1'='1"}).count())
`)
    expect(r.error).toBeNull()
    expect(r.stdout).toBe('[Row(n=3)]\n0\n')
  })
})
