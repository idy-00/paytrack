<?php
use App\Models\Article;
use App\Models\Client;
use App\Models\Shop;
use App\Models\Supplier;
use App\Models\SupplierOrder;
use App\Models\SupplierOrderItem;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (config('database.default') !== 'mysql' || getenv('PAYTRACK_CONCURRENCY_ALLOW_HOSTINGER') !== 'true') throw new RuntimeException('Safety stop: explicit PAYTRACK_CONCURRENCY_ALLOW_HOSTINGER=true is required.');
$database = (string) config('database.connections.mysql.database');
$now = now(); $suffix = Str::lower((string) Str::ulid());
$tenant = Tenant::create(['name' => 'Audit supplier '.$suffix, 'slug' => 'audit-supplier-'.$suffix]);
app()->instance('current_tenant_id', $tenant->id);
$shop = Shop::forceCreate(['tenant_id' => $tenant->id, 'name' => 'Audit shop']);
$planId = DB::table('subscription_plans')->insertGetId(['name'=>'Audit suppliers','slug'=>'audit-sup-'.$suffix,'price_monthly'=>1000,'price_yearly'=>10000,'max_users'=>2,'supplier_orders'=>true,'created_at'=>$now,'updated_at'=>$now]);
DB::table('subscriptions')->insert(['tenant_id'=>$tenant->id,'plan_id'=>$planId,'billing_cycle'=>'monthly','status'=>'active','current_period_start'=>$now,'current_period_end'=>$now->copy()->addMonth(),'created_at'=>$now,'updated_at'=>$now]);
Role::firstOrCreate(['name'=>'admin_entreprise','guard_name'=>'web']);
$user = User::forceCreate(['tenant_id'=>$tenant->id,'shop_id'=>$shop->id,'name'=>'Audit admin','email'=>'supplier-'.$suffix.'@example.test','password'=>'not-used','is_active'=>true]); $user->assignRole('admin_entreprise');
$supplier = Supplier::forceCreate(['tenant_id'=>$tenant->id,'name'=>'Audit supplier']);
$article = Article::forceCreate(['tenant_id'=>$tenant->id,'name'=>'Audit receipt article','price'=>1000,'stock'=>0,'is_active'=>true]);
$order = SupplierOrder::forceCreate(['tenant_id'=>$tenant->id,'shop_id'=>$shop->id,'supplier_id'=>$supplier->id,'created_by'=>$user->id,'reference'=>'PO-AUDIT-'.$suffix,'total_amount'=>5000,'remaining_amount'=>5000,'status'=>'sent','order_date'=>$now->toDateString()]);
$item = SupplierOrderItem::forceCreate(['supplier_order_id'=>$order->id,'article_id'=>$article->id,'article_name'=>$article->name,'quantity_ordered'=>5,'quantity_received'=>0,'unit_price'=>1000,'total_price'=>5000]);
$token = $user->createToken('audit-supplier-concurrency')->plainTextToken; $barrier='supplier-barrier-'.$suffix;
$environment=['APP_ENV'=>'testing','CACHE_STORE'=>'array','SESSION_DRIVER'=>'array','QUEUE_CONNECTION'=>'sync','DB_CONNECTION'=>'mysql','DB_HOST'=>(string)config('database.connections.mysql.host'),'DB_PORT'=>(string)config('database.connections.mysql.port'),'DB_DATABASE'=>$database,'DB_USERNAME'=>(string)config('database.connections.mysql.username'),'DB_PASSWORD'=>(string)config('database.connections.mysql.password'),'PAYTRACK_AUDIT_URL'=>'/api/supplier-orders/'.$order->id.'/receive','PAYTRACK_AUDIT_PAYLOAD'=>json_encode(['items'=>[['id'=>$item->id,'quantity_received'=>5]]],JSON_THROW_ON_ERROR),'PAYTRACK_AUDIT_TOKEN'=>$token,'PAYTRACK_AUDIT_BARRIER_ID'=>$barrier];
DB::statement('DROP TABLE IF EXISTS audit_concurrency_barrier'); DB::statement('CREATE TABLE audit_concurrency_barrier (barrier_id varchar(255) not null, worker_id varchar(255) not null, primary key (barrier_id, worker_id))');
$command=escapeshellarg(PHP_BINARY).' '.escapeshellarg(__DIR__.'/supplier_receipt_concurrency_worker.php'); $desc=[0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']]; $processes=[];
foreach(['worker-a','worker-b'] as $id){$process=proc_open($command,$desc,$pipes,base_path(),$environment+['PAYTRACK_AUDIT_WORKER_ID'=>$id]); if(!is_resource($process))throw new RuntimeException('worker start failed'); fclose($pipes[0]);$processes[$id]=[$process,$pipes];}
$workers=[]; foreach($processes as $id=>[$process,$pipes]){$out=stream_get_contents($pipes[1]);$err=stream_get_contents($pipes[2]);fclose($pipes[1]);fclose($pipes[2]);$workers[$id]=['exit_code'=>proc_close($process),'stdout'=>trim($out),'stderr'=>trim($err)];}
$proof=['workers'=>$workers,'article_stock'=>$article->fresh()->stock,'quantity_received'=>$item->fresh()->quantity_received,'order_status'=>$order->fresh()->status,'stock_movements'=>DB::table('stock_movements')->where('article_id',$article->id)->where('reason','supplier_receipt')->count()]; echo json_encode($proof,JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR).PHP_EOL;
if($proof['article_stock']!==5||$proof['quantity_received']!==5||$proof['order_status']!=='received'||$proof['stock_movements']!==1||array_filter($workers,fn($w)=>$w['exit_code']!==0)!==[])exit(1);
